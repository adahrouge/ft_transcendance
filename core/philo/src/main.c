/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.c                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/03/28 16:28:14 by adahroug          #+#    #+#             */
/*   Updated: 2025/03/29 16:22:53 by adahroug         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "philosophers.h"

void	clean(t_data *ptr)
{
	t_philo	*philo;
	int		i;

	i = 0;
	while (i < ptr->philo_nb)
	{
		philo = ptr->philos + i;
		safe_mutex_handle(&philo->philo_mutex, DESTROY);
		i++;
	}
	safe_mutex_handle(&ptr->write_mutex, DESTROY);
	safe_mutex_handle(&ptr->table_mutex, DESTROY);
	free(ptr->forks);
	free(ptr->philos);
}

void	*safe_malloc(size_t bytes)
{
	void	*ret;

	ret = malloc(bytes);
	if (ret == NULL)
		error_exit("malloc failed");
	return (ret);
}

int	simulation_finished(t_data *ptr)
{
	return (get_int(&ptr->table_mutex, &ptr->end_simulation));
}

int	main(int argc, char **argv)
{
	t_data	*ptr;

	ptr = malloc(sizeof(t_data));
	memset(ptr, 0, sizeof(t_data));
	if (argc == 5 || argc == 6)
	{
		parse_input(ptr, argv);
		setup(ptr);
		dinner_start(ptr);
		clean(ptr);
		free(ptr);
	}
	else
		error_exit("Wrong input");
}
