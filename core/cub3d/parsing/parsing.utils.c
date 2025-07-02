/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   parsing.utils.c                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/13 20:23:23 by adahroug          #+#    #+#             */
/*   Updated: 2025/05/19 13:14:06 by adahroug         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "cub3d.h"

int check_texture(char *filename)
{
	int fd;
	int len;
	char *extension;

	fd = open(filename, O_RDONLY);
	if (fd < 0)
		return 0;
	len = ft_strlen(filename);
	if (len < 4)
	{
		close(fd);
		return 0;
	}
	extension = ft_substr(filename, len - 4, 4);
	if ((ft_strcmp(extension, ".xpm") != 0) && (ft_strcmp(extension, ".png") != 0))
	{
		close(fd);
		free(extension);
		return 0;
	}
	close(fd);
	free(extension);
	return 1;
}
void copy_map(t_data *p, int map_start)
{
	int index;
	int finish;

	finish = map_start;
	index = 0;
	while (p->map_content[finish] != NULL)
		finish++;
	p->map = malloc((finish - map_start + 1) * sizeof(char *));
	if (!p->map)
		return ;
	while (map_start < finish)
	{
		p->map[index] = malloc((ft_strlen(p->map_content[map_start]) + 1) * sizeof(char));
		if (!p->map[index])
		{
			while (--index >= 0)
				free(p->map[index]);
			free(p->map);
			return ;
		}
		ft_strcpy(p->map[index], p->map_content[map_start]);
		index++;
		map_start++;
	}
	p->map[index] = NULL;
}

void trimwhitespace_str(char *line)
{
	int end;

	end = ft_strlen(line) - 1;
	while (end >= 0 && line[end] == ' ')
		end--;
	line[end + 1] = '\0';
	return ;
}
   